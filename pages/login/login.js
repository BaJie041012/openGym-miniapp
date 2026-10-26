Page({
  guestMode: function () {
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && rt.switchTab) rt.switchTab({ url: '/pages/home/home' });
    else if (rt && rt.reLaunch) rt.reLaunch({ url: '/pages/home/home' });
  }
});
