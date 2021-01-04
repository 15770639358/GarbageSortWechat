const db = wx.cloud.database()

export async function getQuestionInfo() {
  const countResult = await db.collection('qusetionResult').count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 20)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('qusetionResult').skip(i * 20).limit(20).where({
      _openid: 'user-open-id',
    }).get()
    tasks.push(promise)
  }
  // 等待所有
  return (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data),
      errMsg: acc.errMsg,
    }
  })
}