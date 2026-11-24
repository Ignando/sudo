import express from 'express'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import healthRoutes from './routes/health.js'
import inventoryRoutes from './routes/inventory.js'
import productRoutes from './routes/products.js'
import salesRoutes from './routes/sales.js'

const app = express()
const port = Number(process.env.PORT ?? '3001')

app.use(express.json({ limit: '100kb' }))

// Every router uses paths relative to /api, e.g. router.get('/products') serves GET /api/products.
// Mounted in the same order the routes were originally declared.
app.use('/api', healthRoutes)
app.use('/api', authRoutes)
app.use('/api', productRoutes)
app.use('/api', inventoryRoutes)
app.use('/api', dashboardRoutes)
app.use('/api', salesRoutes)

app.listen(port, '127.0.0.1', () => {
  console.log(`Backend listening at http://127.0.0.1:${port}`)
})
