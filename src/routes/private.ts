import { Router } from 'express';
import { hasPermissionIn } from '../middlewares/permissions.middleware';
import EmployeeController from '../controllers/employee.controller';
import ObjectiveController from '../controllers/objective.controller';
import ScheduleController from '../controllers/schedule.controller';
import PeriodController from '../controllers/period.controller';
import SignedController from '../controllers/signed.controller';
import UserController from '../controllers/user.controller';

// interfaces

// controllers

class PrivateRoutes{

  constructor(private router: Router = Router()){}

  public routes(): Router{
    // test route: only requires authentication
    // this.router.get('/test', (req: Request, res: Response): Response => {
    //   return res.status(200).json('test OK!');
    // });

    // employee
    this.router.get('/employees', hasPermissionIn('list', 'employee'), EmployeeController.index);
    this.router.post('/employees',hasPermissionIn('create', 'employee'), EmployeeController.create);
    this.router.get('/employees/:id', hasPermissionIn('show', 'employee'), EmployeeController.show);
    this.router.patch('/employees/:id', hasPermissionIn('update', 'employee'), EmployeeController.update);
    this.router.delete('/employees/:id', hasPermissionIn('delete', 'employee'), EmployeeController.delete);

    // objective
    this.router.get('/objectives', hasPermissionIn('list', 'objective'), ObjectiveController.index);
    this.router.post('/objectives',hasPermissionIn('create', 'objective'), ObjectiveController.create);
    this.router.get('/objectives/:id', hasPermissionIn('show', 'objective'), ObjectiveController.show);
    this.router.patch('/objectives/:id', hasPermissionIn('update', 'objective'), ObjectiveController.update);
    this.router.delete('/objectives/:id', hasPermissionIn('delete', 'objective'), ObjectiveController.delete);
    
    // schedule
    this.router.get('/schedules', hasPermissionIn('list', 'schedule'), ScheduleController.index);
    this.router.post('/schedules',hasPermissionIn('create', 'schedule'), ScheduleController.create);
    this.router.get('/schedules/new', hasPermissionIn('create', 'schedule'), ScheduleController.newRecord);
    
    // period
    this.router.get('/period/:id', hasPermissionIn('edit', 'period'), PeriodController.getPeriod);
    this.router.post('/period',hasPermissionIn('create', 'period'), PeriodController.create);
    // this.router.patch('/period/:id', hasPermissionIn('edit', 'period'), PeriodController.update);

    this.router.post('/period/:id/create-shifts',hasPermissionIn('create', 'period'), PeriodController.createShifts);
    this.router.patch('/period/:id/update-shifts', hasPermissionIn('edit', 'period'), PeriodController.updateShifts);
    this.router.delete('/period/:id', hasPermissionIn('delete', 'period'), PeriodController.delete);
    
    // signed
    this.router.post('/signed', hasPermissionIn('signing', 'singed'), SignedController.signedEmployee);
    // user
    // this.router.post('/users', hasPermissionIn('create', 'user'), UserController.create);

    return this.router;
  }
}

const privateRoutes: PrivateRoutes = new PrivateRoutes();
export default privateRoutes.routes();
