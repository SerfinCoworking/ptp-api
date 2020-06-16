import { Router, Request, Response } from 'express';
import { hasPermissionIn } from '../middlewares/permissions.middleware';
import EmployeeController from '../controllers/employee.controller';
import CustomerController from '../controllers/customer.controller';

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

    // employee
    this.router.get('/customers', hasPermissionIn('list', 'employee'), CustomerController.index);
    this.router.post('/customers',hasPermissionIn('create', 'employee'), CustomerController.create);
    this.router.get('/customers/:id', hasPermissionIn('show', 'employee'), CustomerController.show);
    this.router.patch('/customers/:id', hasPermissionIn('update', 'employee'), CustomerController.update);
    this.router.delete('/customers/:id', hasPermissionIn('delete', 'employee'), CustomerController.delete);

    return this.router;
  }
}

const privateRoutes: PrivateRoutes = new PrivateRoutes();
export default privateRoutes.routes();
