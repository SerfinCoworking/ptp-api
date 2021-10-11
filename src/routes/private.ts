import { Router } from 'express';
import { hasPermissionIn } from '../middlewares/permissions.middleware';
import RoleController from '../controllers/role.controller';
import UserController from '../controllers/user.controller';
import EmployeeController from '../controllers/employee.controller';
import ObjectiveController from '../controllers/objective.controller';
import ScheduleDepController from '../controllers/schedule-dep.controller';
import ScheduleController from '../controllers/schedule.controller';
import EventController from '../controllers/event.controller';
import PeriodController from '../controllers/period.controller';
import NewsConceptController from '../controllers/newsConcept.controller';
import NewsController from '../controllers/news.controller';
import SignedController from '../controllers/signed.controller';
import LiquidationController from '../controllers/liquidation.controller';
import MovementController from '../controllers/movement.controller';
import TemplateController from '../controllers/template.controller';
import EmployeeSignedController from '../controllers/employeeSigned.controller';

class PrivateRoutes{

  constructor(private router: Router = Router()){}

  public routes(): Router{
    // test route: only requires authentication
    // this.router.get('/test', (req: Request, res: Response): Response => {
    //   return res.status(200).json('test OK!');
    // });

    // Role
    this.router.get('/roles', hasPermissionIn('read', 'role'), RoleController.index);
    this.router.post('/roles', hasPermissionIn('create', 'role'), RoleController.create);
    this.router.get('/roles/:id', hasPermissionIn('read', 'role'), RoleController.show);
    this.router.patch('/roles/:id', hasPermissionIn('update', 'role'), RoleController.update);
    this.router.delete('/roles/:id', hasPermissionIn('delete', 'role'), RoleController.delete);

    // user
    this.router.get('/users', hasPermissionIn('read', 'user'), UserController.index);
    this.router.post('/users', hasPermissionIn('create', 'user'), UserController.create);
    this.router.get('/users/:id', hasPermissionIn('read', 'user'), UserController.show);
    this.router.patch('/users/:id', hasPermissionIn('update', 'user'), UserController.update);
    this.router.patch('/users/:id/permissions', hasPermissionIn('permission', 'user'), UserController.updatePermissions);
    this.router.delete('/users/:id', hasPermissionIn('delete', 'user'), UserController.delete);

    // employee
    this.router.get('/employees', hasPermissionIn('read', 'employee'), EmployeeController.index);
    this.router.get('/employees/available', hasPermissionIn('read', 'employee'), EmployeeController.availableEmployees);
    this.router.post('/employees', hasPermissionIn('create', 'employee'), EmployeeController.create);
    this.router.get('/employees/:id', hasPermissionIn('read', 'employee'), EmployeeController.show);
    this.router.patch('/employees/:id', hasPermissionIn('update', 'employee'), EmployeeController.update);
    this.router.patch('/employees/:id/status', hasPermissionIn('status', 'employee'), EmployeeController.updateStatus);
    this.router.delete('/employees/:id', hasPermissionIn('delete', 'employee'), EmployeeController.delete);

    // objective
    this.router.get('/objectives', hasPermissionIn('read', 'objective'), ObjectiveController.index);
    this.router.post('/objectives', hasPermissionIn('create', 'objective'), ObjectiveController.create);
    this.router.get('/objectives/:id', hasPermissionIn('read', 'objective'), ObjectiveController.show);
    this.router.patch('/objectives/:id', hasPermissionIn('update', 'objective'), ObjectiveController.update);
    this.router.patch('/objectives/:id/password-reset', hasPermissionIn('password', 'objective'), ObjectiveController.passwordReset);
    this.router.delete('/objectives/:id', hasPermissionIn('delete', 'objective'), ObjectiveController.delete);
    
    // schedule
    this.router.get('/schedules-dep', hasPermissionIn('read', 'schedule'), ScheduleDepController.index);
    this.router.post('/schedules-dep',hasPermissionIn('create', 'schedule'), ScheduleDepController.create);
    this.router.get('/schedules-dep/new', hasPermissionIn('create', 'schedule'), ScheduleDepController.newRecord);
    this.router.get('/schedule-by-id-dep/:id',hasPermissionIn('read', 'schedule'), ScheduleDepController.getScheduleById);
    this.router.get('/schedules-dep/:id',hasPermissionIn('read', 'schedule'), ScheduleDepController.show);
    
    // schedule
    this.router.get('/schedules', hasPermissionIn('read', 'schedule'), ScheduleController.index);
    this.router.post('/schedules',hasPermissionIn('create', 'schedule'), ScheduleController.create);
    this.router.get('/schedules/:id',hasPermissionIn('read', 'schedule'), ScheduleController.show);
    this.router.patch('/schedules/:id', hasPermissionIn('update', 'schedule'), ScheduleController.update);
    
    // period
    this.router.get('/period/employees-for-planning', hasPermissionIn('read', 'schedule'), PeriodController.getEmployeeForPlannig);
    this.router.get('/period/:id', hasPermissionIn('read', 'schedule'), PeriodController.getPeriod);
    this.router.get('/period/:id/show', hasPermissionIn('read', 'schedule'), PeriodController.show); // use by new implementation
    this.router.get('/period/:id/monitor', hasPermissionIn('read', 'schedule'), PeriodController.monitor); // use by new implementation
    this.router.get('/period/:id/print', hasPermissionIn('read', 'schedule'), PeriodController.getPrintPeriod);
    this.router.get('/period/:id/planning', hasPermissionIn('read', 'schedule'), PeriodController.getPlannig);
    this.router.post('/period', hasPermissionIn('create', 'schedule'), PeriodController.create);
    this.router.post('/period/:id/planning', hasPermissionIn('read', 'schedule'), PeriodController.addEmployeeInPlannig);
    this.router.patch('/period/:id', hasPermissionIn('update', 'schedule'), PeriodController.update);
    this.router.delete('/period/:id/planning/:employee_id', hasPermissionIn('read', 'schedule'), PeriodController.deleteEmployeeInPlannig);
    
    // events
    // this.router.get('/schedules', hasPermissionIn('read', 'schedule'), ScheduleController.index);
    this.router.post('/period/:period_id/:employee_id/events',hasPermissionIn('create', 'event'), EventController.create);
    this.router.patch('/period/:period_id/:employee_id/events/:id',hasPermissionIn('update', 'event'), EventController.update);
    this.router.delete('/period/:period_id/:employee_id/events/:id',hasPermissionIn('delete', 'event'), EventController.delete);
    // this.router.get('/schedules/:id',hasPermissionIn('read', 'schedule'), ScheduleController.show);
    // this.router.patch('/schedules/:id', hasPermissionIn('update', 'schedule'), ScheduleController.update);

    this.router.get('/periods/objective/:objectiveId',hasPermissionIn('read', 'schedule'), PeriodController.index);
    this.router.post('/period/:id/create-shifts',hasPermissionIn('create', 'schedule'), PeriodController.createShifts);
    this.router.patch('/period/:id/update-shifts', hasPermissionIn('update', 'schedule'), PeriodController.updateShifts); // deprecated
    this.router.patch('/period/:id/update-signeds', hasPermissionIn('update', 'schedule'), PeriodController.updateSigneds);
    this.router.delete('/period/:id', hasPermissionIn('delete', 'schedule'), PeriodController.delete);
    
    // liquidation
    this.router.get('/liquidations', hasPermissionIn('read', 'liquidation'), LiquidationController.index);
    this.router.post('/liquidation', hasPermissionIn('create', 'liquidation'), LiquidationController.create);
    this.router.get('/liquidation/:id', hasPermissionIn('read', 'liquidation'), LiquidationController.show);
    this.router.patch('/liquidation/:id', hasPermissionIn('update', 'liquidation'), LiquidationController.update);
    this.router.patch('/liquidation/:id/close', hasPermissionIn('close', 'liquidation'), LiquidationController.close);
    this.router.delete('/liquidation/:id', hasPermissionIn('delete', 'liquidation'), LiquidationController.delete);
    this.router.get('/liquidation/liquidated-news/:id', hasPermissionIn('read', 'liquidation'), LiquidationController.liquidatedNews);
    this.router.get('/liquidation/:id/:employee_id', hasPermissionIn('read', 'liquidation'), LiquidationController.employeeDetail);
    
    // news
    this.router.get('/news', hasPermissionIn('read', 'news'), NewsController.index);
    this.router.get('/news/new-record', hasPermissionIn('read', 'news'), NewsController.newRecord);
    this.router.get('/news-by-date', hasPermissionIn('read', 'news'), NewsController.getNewsByDate);
    this.router.post('/news',hasPermissionIn('create', 'news'), NewsController.create);
    this.router.get('/news/:id', hasPermissionIn('read', 'news'), NewsController.show);
    this.router.patch('/news/:id', hasPermissionIn('update', 'news'), NewsController.update);
    this.router.delete('/news/:id', hasPermissionIn('delete', 'news'), NewsController.delete);
    
    // newsConcept
    this.router.get('/news-concept', hasPermissionIn('read', 'news'), NewsConceptController.index);
    this.router.post('/news-concept',hasPermissionIn('create', 'news'), NewsConceptController.create);
    this.router.get('/news-concept/:id', hasPermissionIn('read', 'news'), NewsConceptController.show);
    this.router.patch('/news-concept/:id', hasPermissionIn('update', 'news'), NewsConceptController.update);
    this.router.delete('/news-concept/:id', hasPermissionIn('delete', 'news'), NewsConceptController.delete);
    
    // template
    this.router.get('/templates', hasPermissionIn('read', 'news'), TemplateController.index);
    this.router.post('/template',hasPermissionIn('create', 'news'), TemplateController.create);
    this.router.get('/template/:id', hasPermissionIn('read', 'news'), TemplateController.show);
    this.router.patch('/template/:id', hasPermissionIn('update', 'news'), TemplateController.update);
    this.router.delete('/template/:id', hasPermissionIn('delete', 'news'), TemplateController.delete);
    
    // signed
    this.router.post('/signed', hasPermissionIn('signed', 'objective'), SignedController.employeeSign);
    this.router.post('/period/:id/employee/:employee_id/manual-sign', hasPermissionIn('update', 'schedule'), SignedController.manualSign);
    
    // signedByEmployee
    this.router.get('/show/:employee_liquidated_id', hasPermissionIn('read', 'liquidation'), EmployeeSignedController.show);
    this.router.get('/get-employee-signeds', hasPermissionIn('read', 'liquidation'), EmployeeSignedController.getEmployeeSigneds);

    // movement
    this.router.get('/movements', hasPermissionIn('read', 'movement'), MovementController.index);
    this.router.post('/movements',hasPermissionIn('create', 'movement'), MovementController.create);
    this.router.get('/movements/:id', hasPermissionIn('read', 'movement'), MovementController.show);

    return this.router;
  }
}

const privateRoutes: PrivateRoutes = new PrivateRoutes();
export default privateRoutes.routes();
