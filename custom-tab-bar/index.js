// 自定义 tabBar 组件
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/home/home', text: '今日' },
      { pagePath: '/pages/plan/plan', text: '计划' },
      { pagePath: '/pages/workout/workout', text: '训练' },
      { pagePath: '/pages/library/library', text: '动作库' },
      { pagePath: '/pages/settings/settings', text: '设置' }
    ]
  },

  methods: {
    switchTab: function (e) {
      var idx = e.currentTarget.dataset.index;
      var path = e.currentTarget.dataset.path;
      if (this.data.selected === idx) return;
      this.setData({ selected: idx });
      qd.switchTab({ url: path });
    }
  }
});
