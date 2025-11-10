import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'

const {
  DB_HOST = '154.201.81.130',
  DB_PORT = '3309',
  DB_USER = 'root',
  DB_PASSWORD = '123456',
  DB_NAME = 'cool',
  TOKEN_API_PORT = '4000'
} = process.env

const SENTINEL_EXPIRE = '1999-09-09 00:00:00'

const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  timezone: 'Z'
})

const app = express()
app.use(cors())
app.use(express.json())

app.get('/token-info', async (req, res) => {
  const token = (req.query.token || '').trim()

  if (!token) {
    return res.status(400).json({ message: 'Token 不能为空' })
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM chatgpt_user WHERE userToken = ? LIMIT 1',
      [token]
    )

    if (!rows.length) {
      return res.status(404).json({ message: '未找到对应的套餐信息' })
    }

    const row = rows[0]
    const expire = row.expireTime ? new Date(row.expireTime) : null
    const planLabel = derivePlanLabel(row)

    res.json({
      userToken: row.userToken,
      planLabel,
      isPlus: row.isPlus ?? null,
      expireTime: expire ? expire.toISOString() : null
    })
  } catch (error) {
    console.error('Token 查询失败:', error)
    res.status(500).json({ message: '查询失败，请稍后重试' })
  }
})

app.post('/activate', async (req, res) => {
  const token = (req.body?.token || '').trim()

  if (!token) {
    return res.status(400).json({ message: 'Token 不能为空' })
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, userToken, expireTime, isPlus, remark FROM chatgpt_user WHERE userToken = ? LIMIT 1',
      [token]
    )

    if (!rows.length) {
      return res.status(404).json({ message: '未找到对应的 Token' })
    }

    const row = rows[0]

    if (!isSentinelExpire(row.expireTime)) {
      return res.status(400).json({ message: '该 Token 已激活或不可用' })
    }

    const suffix = token.slice(-1).toLowerCase()
    let durationLabel = ''
    let targetDate = new Date()

    if (suffix === 'm') {
      durationLabel = '月卡'
      targetDate = addDuration(targetDate, { months: 1 })
    } else if (suffix === 'y') {
      durationLabel = '年卡'
      targetDate = addDuration(targetDate, { years: 1 })
    } else {
      return res.status(400).json({ message: 'Token 格式不正确' })
    }

    const mysqlDate = formatMysqlDateTime(targetDate)
    await pool.execute('UPDATE chatgpt_user SET expireTime = ? WHERE id = ?', [
      mysqlDate,
      row.id
    ])

    res.json({
      userToken: row.userToken,
      planLabel: durationLabel,
      expireTime: targetDate.toISOString()
    })
  } catch (error) {
    console.error('Token 激活失败:', error)
    res.status(500).json({ message: '激活失败，请稍后重试' })
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(Number(TOKEN_API_PORT), () => {
  console.log(`Token lookup service listening on port ${TOKEN_API_PORT}`)
})

function derivePlanLabel(row) {
  if (!row) return null

  const fallback =
    row.packageType ??
    row.planType ??
    row.plan ??
    row.comboType ??
    row.package ??
    row.level ??
    row.type ??
    row.remark ??
    null

  if (fallback) return fallback

  if (typeof row.isPlus === 'number') {
    return row.isPlus === 1 ? 'Plus 套餐' : '标准套餐'
  }

  return null
}

function isSentinelExpire(value) {
  if (!value) return false
  return formatMysqlDateTime(value) === SENTINEL_EXPIRE
}

function addDuration(date, { months = 0, years = 0 } = {}) {
  const result = new Date(date)
  if (months) {
    result.setMonth(result.getMonth() + months)
  }
  if (years) {
    result.setFullYear(result.getFullYear() + years)
  }
  return result
}

function formatMysqlDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return SENTINEL_EXPIRE
  const pad = (num) => String(num).padStart(2, '0')
  const yyyy = date.getUTCFullYear()
  const mm = pad(date.getUTCMonth() + 1)
  const dd = pad(date.getUTCDate())
  const hh = pad(date.getUTCHours())
  const mi = pad(date.getUTCMinutes())
  const ss = pad(date.getUTCSeconds())
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}
