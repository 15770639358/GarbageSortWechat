const db = wx.cloud.database()
Page({


  data: {
    MAX_LIMIT: 20,
    page: 0,
    dataCount: 0,
    datas: [],
    searchTxt: "",
    logo: "",
    isShow: false,
    nowSortId: -1,
  },

  onLoad: async function (options) {
    let dataCount = await db.collection('product').count()
    this.setData({
      dataCount
    })
  },

  searchIcon: function (e) {
    this.setData({
      logo: '',
      isShow: false
    })
    let searchTxt = e.detail.value
    this.setData({
      page: 0,
      searchTxt
    })
    this.onGetData()
  },

  onGetData: function () {
    wx.showLoading({
      title: '正在加载数据中.....',
    })
    if (this.data.dataCount <= this.data.page * this.data.MAX_LIMIT) {
      wx.showToast({
        title: '数据已经加载完',
        icon: "none"
      })
      wx.hideLoading()
      return
    }
    let that = this
    if (this.data.page === 0) {
      this.setData({
        datas: [],
        nowSortId: -1
      })
    }
    let datas = db.collection('product').skip(this.data.page * this.data.MAX_LIMIT).limit(this.data.MAX_LIMIT).where({
      name: db.RegExp({
        regexp: that.data.searchTxt,
      })
    }).get({
      success: function (res) {
        wx.hideLoading()
        let page = that.data.page + 1
        that.setData({
          page
        })
        let datas = that.data.datas
        for (let i = 0; i < res.data.length; i++) {
          datas.push(res.data[i])
        }
        that.setData({
          datas: that.data.datas
        })
      },
      fail: res => {
        wx.hideLoading()
        wx.showToast({
          title: '数据加载失败',
          icon: "none"
        })
      }
    })
  },

  onItemClick: function (event) {
    let index = event.currentTarget.dataset.index
    let logoImg = ""
    switch (parseInt(index)) {
      case 1:
        logoImg = "../../resource/images/RecycleableWaste.jpg"
        break;
      case 2:
        logoImg = "../../resource/images/HazardouAwaste.jpg"
        break;
      case 3:
        logoImg = "../../resource/images/HouseholdfoodWaste.jpg"
        break;
      case 4:
        logoImg = "../../resource/images/ResidualWaste.png"
        break;
    }
    this.setData({
      logo: logoImg,
      isShow: !this.data.isShow,
      nowSortId: index
    })
    this.animation(1, 1)
  },

  animation(opacity, scale) {
    let animation = wx.createAnimation({
      duration: 500,
      timingFunction: 'ease',
    });
    animation.opacity(opacity).scale(scale).step()
    this.setData({
      animation: animation.export()
    })
  },

  hideModal() {
    this.animation(0, 1.3)
    setTimeout(() => {
      this.setData({
        isShow: false,
        nowSortId: -1
      })
    }, 500);
  },

  goResult(e) {
    if (this.data.nowSortId !== -1) {
      wx.navigateTo({
        url: '/pages/resultDetalis/resultDetalis?sortId='+this.data.nowSortId,
      })
    }

  },

  onPullDownRefresh: async function () {
    this.data.page = 0
    this.data.datas = []
    await this.onGetData()
    wx.stopPullDownRefresh()
  },

  onReachBottom: function () {
    this.onGetData()
  },

})