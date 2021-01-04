// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()
const _ = db.command


// 云函数入口函数
exports.main = async (event, context) => {
  let integrals = event.integrals
  let openId = event.openId
  try {
    return await  db.collection('integral').where({
      _openid: openId,
    })
    .update({
      data: {
          nowIntegral:  _.inc(integrals),
          totalIntegral: _.inc(integrals)
      },
    })
  } catch(e) {
    return 'error'
  }
 
}