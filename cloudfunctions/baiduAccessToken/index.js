const rq = require('request-promise')
const cloud = require('wx-server-sdk') 
// 
/**
 * 获取百度ai AccessToken
 */
exports.main = async(event, context) => {
  let apiKey = 'GeDtPrL2GQUQeQpE9zGvsgGd',
    grantType = 'client_credentials',
    secretKey = 'rXoMUkEuehaFszq8gmNBOa9QPcK3GNn9',
    url = `https://aip.baidubce.com/oauth/2.0/token`

   return  await rq({
        method: 'POST',
        url,
        form: {
          "grant_type": grantType,
          "client_secret": secretKey,
          "client_id": apiKey
        },
        json: true
      }).then(data=>{
        return Promise.resolve({
          code: 0,
          data,
          info: '操作成功！'
        })
     }).catch(error=>{
        console.log(error)
        if (!error.code){
          return Promise.reject(error)
        } 
        return error
      })
}