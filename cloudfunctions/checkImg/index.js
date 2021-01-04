const cloud = require('wx-server-sdk')
cloud.init()
exports.main = async (event, context) => {
  let type = event.type
  let buffer = event.buffer
  try {
    const result = await cloud.openapi.security.imgSecCheck({
      media: {
        header: { 'Content-Type': 'application/octet-stream' },
        contentType: type,
        value: Buffer.from(buffer)
      }
    })
    return result
  } catch (err) {
    return err
  }
}