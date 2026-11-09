// 好友码管理 首页
// 左上角显示千岛昵称，中间三个按钮：管理账号 / 添加好友码 / 获取好友码

import { Auth } from '../../utils/auth.js';
import * as API from '../../utils/api.js';

Page({
  data: {
    nickname: '',
    openId: '',
    players: [],          // 我的玩家账号列表
    selectedPlayerId: '', // 当前选中的玩家账号（用于添加/查看好友码）
    codes: [],            // 当前选中账号下的好友码
    claimResult: '',      // 获取到的好友码
    claimPlayerId: '',    // 获取到的好友码所属玩家账号
    loading: false,
    // UI 状态：哪个面板展开
    panel: 'main',        // main / manage / addCodes / claimResult
    // 添加好友码输入框内容（批量，每行一个）
    codeInput: ''
  },

  onLoad: function () {
    var self = this;
    // 先立即刷一次（可能已有旧 session），同时等登录完成后再刷
    self._refreshAuth();
    if (Auth.ready) {
      Auth.ready().then(function () { self._refreshAuth(); });
    }
    self._loadPlayers();
  },

  onShow: function () {
    this._refreshAuth();
  },

  _refreshAuth: function () {
    var sess = Auth.session();
    var openId = sess && sess.openId ? sess.openId : '';
    var nickname = sess && sess.nickname ? sess.nickname : '';
    // 如果后端把 openId 当 nickname 返回（fetchNickname 失败兜底），就清空让模板显示"旅人"
    if (nickname === openId) nickname = '';
    this.setData({ nickname: nickname, openId: openId });
  },

  _loadPlayers: function () {
    var self = this;
    API.listPlayers().then(function (players) {
      if (!players) {
        self.setData({ players: [] });
        return;
      }
      // 默认选中第一个
      var selected = self.data.selectedPlayerId;
      if (!selected && players.length > 0) {
        selected = players[0].playerId;
      }
      self.setData({ players: players, selectedPlayerId: selected });
      if (selected) {
        self._loadCodes(selected);
      }
    });
  },

  _loadCodes: function (playerId) {
    var self = this;
    API.listCodes(playerId).then(function (codes) {
      self.setData({ codes: codes || [] });
    });
  },

  // ─── 管理账号 ─────────────────────────────────────────────────────────────

  openManage: function () {
    this.setData({ panel: 'manage' });
    this._loadPlayers();
  },

  closeManage: function () {
    this.setData({ panel: 'main' });
  },

  createPlayer: function () {
    var self = this;
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (!rt) return;

    rt.showModal({
      title: '创建玩家账号',
      editable: true,
      placeholderText: '输入纯数字账号（如 888888）',
      success: function (res) {
        if (!res.confirm || !res.content) return;
        var playerId = String(res.content).trim();
        if (!/^\d{1,20}$/.test(playerId)) {
          rt.showToast({ title: '必须是1-20位纯数字', icon: 'none' });
          return;
        }
        // 检查是否已存在
        var exists = self.data.players.some(function (p) { return p.playerId === playerId; });
        if (exists) {
          rt.showToast({ title: '账号已存在', icon: 'none' });
          return;
        }
        rt.showModal({
          title: '备注名（可选）',
          editable: true,
          placeholderText: '给这个账号起个名字',
          success: function (res2) {
            if (!res2.confirm) return;
            var nickname = res2.content ? String(res2.content).trim() : '';
            self._doCreatePlayer(playerId, nickname);
          }
        });
      }
    });
  },

  _doCreatePlayer: function (playerId, nickname) {
    var self = this;
    var rt = typeof qd !== 'undefined' ? qd : null;
    API.createPlayer(playerId, nickname).then(function () {
      if (rt) rt.showToast({ title: '创建成功', icon: 'success' });
      self._loadPlayers();
    });
  },

  deletePlayer: function (e) {
    var self = this;
    var rt = typeof qd !== 'undefined' ? qd : null;
    var playerId = e.currentTarget.dataset.id;
    if (!rt) return;
    rt.showModal({
      title: '确认删除',
      content: '删除该账号及其下所有好友码？',
      success: function (res) {
        if (!res.confirm) return;
        API.deletePlayer(playerId).then(function () {
          if (rt) rt.showToast({ title: '已删除', icon: 'success' });
          // 如果删的是当前选中的，清空选中
          if (self.data.selectedPlayerId === playerId) {
            self.setData({ selectedPlayerId: '', codes: [] });
          }
          self._loadPlayers();
        });
      }
    });
  },

  selectPlayer: function (e) {
    var playerId = e.currentTarget.dataset.id;
    this.setData({ selectedPlayerId: playerId });
    this._loadCodes(playerId);
  },

  // ─── 添加好友码 ────────────────────────────────────────────────────────────

  openAddCodes: function () {
    if (this.data.players.length === 0) {
      var rt = typeof qd !== 'undefined' ? qd : null;
      if (rt) rt.showToast({ title: '请先创建玩家账号', icon: 'none' });
      return;
    }
    this.setData({ panel: 'addCodes', codeInput: '' });
  },

  closeAddCodes: function () {
    this.setData({ panel: 'main' });
  },

  onCodeInput: function (e) {
    this.setData({ codeInput: e.detail.value });
  },

  submitCodes: function () {
    var self = this;
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (!this.data.selectedPlayerId) {
      if (rt) rt.showToast({ title: '请先选择玩家账号', icon: 'none' });
      return;
    }
    var text = (this.data.codeInput || '').trim();
    if (!text) {
      if (rt) rt.showToast({ title: '请输入好友码', icon: 'none' });
      return;
    }
    // 按换行分割
    var codes = text.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (codes.length === 0) {
      if (rt) rt.showToast({ title: '请输入好友码', icon: 'none' });
      return;
    }
    self.setData({ loading: true });
    API.addCodes(self.data.selectedPlayerId, codes).then(function (result) {
      self.setData({ loading: false });
      if (!result) {
        if (rt) rt.showToast({ title: '添加失败，请检查登录', icon: 'none' });
        return;
      }
      if (rt) rt.showToast({ title: '添加成功：新增' + result.inserted + '条', icon: 'success' });
      self.setData({ codeInput: '' });
      self._loadCodes(self.data.selectedPlayerId);
    });
  },

  deleteCode: function (e) {
    var self = this;
    var rt = typeof qd !== 'undefined' ? qd : null;
    var code = e.currentTarget.dataset.code;
    if (!rt) return;
    rt.showModal({
      title: '删除好友码',
      content: '确认删除 ' + code + ' ？',
      success: function (res) {
        if (!res.confirm) return;
        API.deleteCode(self.data.selectedPlayerId, code).then(function () {
          if (rt) rt.showToast({ title: '已删除', icon: 'success' });
          self._loadCodes(self.data.selectedPlayerId);
        });
      }
    });
  },

  // ─── 获取好友码 ────────────────────────────────────────────────────────────

  doClaim: function () {
    var self = this;
    var rt = typeof qd !== 'undefined' ? qd : null;
    self.setData({ loading: true });
    API.claimOne().then(function (result) {
      self.setData({ loading: false });
      if (!result) {
        if (rt) rt.showToast({ title: '暂无可获取的好友码', icon: 'none' });
        self.setData({ panel: 'main' });
        return;
      }
      self.setData({
        panel: 'claimResult',
        claimResult: result.code,
        claimPlayerId: result.playerId
      });
    });
  },

  closeClaim: function () {
    this.setData({ panel: 'main', claimResult: '', claimPlayerId: '' });
  }
});
