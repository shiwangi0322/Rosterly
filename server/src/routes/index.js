import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/http.js'
import * as auth from '../controllers/authController.js'
import * as employees from '../controllers/employeesController.js'
import * as brands from '../controllers/brandsController.js'
import * as processes from '../controllers/processesController.js'
import * as pods from '../controllers/podsController.js'
import * as shifts from '../controllers/shiftsController.js'
import * as leaves from '../controllers/leavesController.js'
import * as rules from '../controllers/rulesController.js'
import * as roster from '../controllers/rosterController.js'
import * as reports from '../controllers/reportsController.js'
import * as settings from '../controllers/settingsController.js'
import {
  brandSchema,
  decisionSchema,
  employeeSchema,
  generateSchema,
  holidaySchema,
  leaveSchema,
  loginSchema,
  notificationSchema,
  podSchema,
  signupSchema,
  processSchema,
  rulesSchema,
  settingsSchema,
  shiftSchema,
} from '../validation/schemas.js'

const router = Router()

router.get('/health', (req, res) => res.json({ ok: true }))
router.post('/auth/login', validate(loginSchema), asyncHandler(auth.login))
router.post('/auth/signup', validate(signupSchema), asyncHandler(auth.signup))

router.use(requireAuth)
router.get('/auth/me', asyncHandler(auth.me))

router.get('/employees', asyncHandler(employees.listEmployees))
router.get('/employees/:id', asyncHandler(employees.getEmployee))
router.post('/employees', validate(employeeSchema), asyncHandler(employees.createEmployee))
router.put('/employees/:id', validate(employeeSchema), asyncHandler(employees.updateEmployee))
router.patch('/employees/:id', validate(employeeSchema.partial()), asyncHandler(employees.updateEmployee))
router.delete('/employees/:id', asyncHandler(employees.deleteEmployee))

router.get('/brands', asyncHandler(brands.listBrands))
router.get('/brands/:id', asyncHandler(brands.getBrand))
router.post('/brands', validate(brandSchema), asyncHandler(brands.createBrand))
router.put('/brands/:id', validate(brandSchema), asyncHandler(brands.updateBrand))
router.delete('/brands/:id', asyncHandler(brands.deleteBrand))

router.get('/processes', asyncHandler(processes.listProcesses))
router.get('/processes/:id', asyncHandler(processes.getProcess))
router.post('/processes', validate(processSchema), asyncHandler(processes.createProcess))
router.put('/processes/:id', validate(processSchema), asyncHandler(processes.updateProcess))
router.delete('/processes/:id', asyncHandler(processes.deleteProcess))

router.get('/pods', asyncHandler(pods.listPods))
router.get('/pods/:id', asyncHandler(pods.getPod))
router.post('/pods', validate(podSchema), asyncHandler(pods.createPod))
router.put('/pods/:id', validate(podSchema), asyncHandler(pods.updatePod))
router.delete('/pods/:id', asyncHandler(pods.deletePod))

router.get('/shifts', asyncHandler(shifts.listShifts))
router.get('/shifts/:id', asyncHandler(shifts.getShift))
router.post('/shifts', validate(shiftSchema), asyncHandler(shifts.createShift))
router.put('/shifts/:id', validate(shiftSchema), asyncHandler(shifts.updateShift))
router.delete('/shifts/:id', asyncHandler(shifts.deleteShift))

router.get('/leaves', asyncHandler(leaves.listLeaves))
router.get('/leaves/:id', asyncHandler(leaves.getLeave))
router.post('/leaves', validate(leaveSchema), asyncHandler(leaves.applyLeave))
router.post('/leaves/:id/approve', validate(decisionSchema), asyncHandler(leaves.approveLeave))
router.post('/leaves/:id/reject', validate(decisionSchema), asyncHandler(leaves.rejectLeave))
router.post('/leaves/:id/cancel', validate(decisionSchema), asyncHandler(leaves.cancelLeave))

router.get('/rules', asyncHandler(rules.getRules))
router.put('/rules', validate(rulesSchema), asyncHandler(rules.updateRules))

router.get('/holidays', asyncHandler(rules.listHolidays))
router.post('/holidays', validate(holidaySchema), asyncHandler(rules.createHoliday))
router.put('/holidays/:id', validate(holidaySchema), asyncHandler(rules.updateHoliday))
router.delete('/holidays/:id', asyncHandler(rules.deleteHoliday))

router.post('/roster/generate', validate(generateSchema), asyncHandler(roster.generate))
router.get('/conflicts', asyncHandler(roster.listConflicts))
router.post('/conflicts/:id/dismiss', asyncHandler(roster.dismissConflict))

router.get('/reports', asyncHandler(reports.summary))
router.get('/settings', asyncHandler(settings.getSettings))
router.put('/settings', validate(settingsSchema), asyncHandler(settings.updateSettings))
router.get('/activity', asyncHandler(settings.listActivity))
router.get('/notifications', asyncHandler(settings.listNotifications))
router.patch('/notifications/:id', validate(notificationSchema), asyncHandler(settings.updateNotification))

export default router
