export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/plan/index',
    'pages/workout/index',
    'pages/library/index',
    'pages/history/index',
    'pages/stats/index',
    'pages/settings/index',
    'pages/login/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#1a1a2e',
    navigationBarTitleText: 'openGym',
    navigationBarTextStyle: 'white',
    backgroundColor: '#1a1a2e'
  },
  tabBar: {
    color: '#888899',
    selectedColor: '#4ECDC4',
    backgroundColor: '#16213e',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/home/index', text: '今日' },
      { pagePath: 'pages/plan/index', text: '计划' },
      { pagePath: 'pages/workout/index', text: '训练' },
      { pagePath: 'pages/library/index', text: '动作库' },
      { pagePath: 'pages/settings/index', text: '设置' }
    ]
  },
  requiredPrivateInfos: [],
  permission: {}
})
