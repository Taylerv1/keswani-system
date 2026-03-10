import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";
import {
    createEmployee,
    deleteEmployee,
    getEmployeeById,
    getEmployees,
    getEmployeesLookup,
    updateEmployee,
} from "../controllers/employee.controller";

const router = Router();

router.use(authenticate);

router.get("/lookup", requireAccess("employees"), getEmployeesLookup);
router.get("/", requireAccess("employees"), getEmployees);
router.get("/:id", requireAccess("employees"), getEmployeeById);
router.post("/", requireAccess("employees"), createEmployee);
router.patch("/:id", requireAccess("employees"), updateEmployee);
router.delete("/:id", requireAccess("employees"), deleteEmployee);

export default router;
