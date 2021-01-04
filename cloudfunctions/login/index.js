// 云函数入口文件
const cloud = require('wx-server-sdk')

const rq = require('request-promise')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const url = 'https://api.weixin.qq.com/sns/jscode2session?appid=wx920f7c4f004553e3&secret=afc236fc43d5e668078046e2bba268df&js_code=' + event.code + '&grant_type=authorization_code'
  return await rq({
    method: 'GET',
    url,
    json: true
  }).then(data => {
    return Promise.resolve({
      code: 0,
      data,
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
      info: '操作成功！'
    })
  }).catch(error => {
    console.log(error)
    if (!error.code) {
      return Promise.reject(error)
    }
    return error
  })

  //https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}