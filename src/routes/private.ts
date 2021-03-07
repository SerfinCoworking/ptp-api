import { Router } from 'express';
import { hasPermissionIn } from '../middlewares/permissions.middleware';
import EmployeeController from '../controllers/employee.controller';
import ObjectiveController from '../controllers/objective.controller';
import ScheduleController from '../controllers/schedule.controller';
import PeriodController from '../controllers/period.controller';
import NewsConceptController from '../controllers/newsConcept.controller';
import NewsController from '../controllers/news.controller';
import SignedController from '../controllers/signed.controller';
import LiquidationController from '../controllers/liquidation.controller';

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
    this.router.get('/schedule-by-id/:id',hasPermissionIn('show', 'schedule'), ScheduleController.getScheduleById);
    this.router.get('/schedules/:id',hasPermissionIn('show', 'schedule'), ScheduleController.show);
    
    // period
    this.router.get('/period/:id', hasPermissionIn('index', 'period'), PeriodController.getPeriod);
    this.router.get('/period/:id/print', hasPermissionIn('index', 'period'), PeriodController.getPrintPeriod);
    this.router.post('/period', hasPermissionIn('create', 'period'), PeriodController.create);
    this.router.patch('/period/:id', hasPermissionIn('edit', 'period'), PeriodController.update);

    this.router.post('/period/:id/create-shifts',hasPermissionIn('create', 'period'), PeriodController.createShifts);
    this.router.patch('/period/:id/update-shifts', hasPermissionIn('edit', 'period'), PeriodController.updateShifts);
    this.router.patch('/period/:id/update-signeds', hasPermissionIn('edit', 'period'), PeriodController.updateSigneds);
    this.router.delete('/period/:id', hasPermissionIn('delete', 'period'), PeriodController.delete);
    
    this.router.get('/liquidations', hasPermissionIn('list', 'liquidation'), LiquidationController.index);
    this.router.get('/liquidation', hasPermissionIn('create', 'liquidation'), LiquidationController.new);

    // news
    this.router.get('/news', hasPermissionIn('list', 'news'), NewsController.index);
    this.router.get('/news/new-record', hasPermissionIn('show', 'news'), NewsController.newRecord);
    this.router.get('/news-by-date', hasPermissionIn('list', 'news'), NewsController.getNewsByDate);
    this.router.post('/news',hasPermissionIn('create', 'news'), NewsController.create);
    this.router.get('/news/:id', hasPermissionIn('show', 'news'), NewsController.show);
    this.router.patch('/news/:id', hasPermissionIn('update', 'news'), NewsController.update);
    this.router.delete('/news/:id', hasPermissionIn('delete', 'news'), NewsController.delete);
    
    // newsConcept
    this.router.get('/news-concept', hasPermissionIn('list', 'news-concept'), NewsConceptController.index);
    this.router.post('/news-concept',hasPermissionIn('create', 'news-concept'), NewsConceptController.create);
    this.router.get('/news-concept/:id', hasPermissionIn('show', 'news-concept'), NewsConceptController.show);
    this.router.patch('/news-concept/:id', hasPermissionIn('update', 'news-concept'), NewsConceptController.update);
    this.router.delete('/news-concept/:id', hasPermissionIn('delete', 'news-concept'), NewsConceptController.delete);
    
    // signed
    this.router.post('/signed', hasPermissionIn('signing', 'singed'), SignedController.signedEmployee);

    return this.router;
  }
}

const privateRoutes: PrivateRoutes = new PrivateRoutes();
export default privateRoutes.routes();
