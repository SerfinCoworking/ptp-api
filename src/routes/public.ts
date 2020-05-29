import { Router } from 'express';
import RoleController from '../controllers/role.controller';
import EmployeeController from '../controllers/employee.controller';
class PublicRoutes{

  constructor(private router: Router = Router()){}

  // deefine your public routes inside of routes function
  public routes(): Router{

    // this.router.get('home', (req: Request, res: Response): Response => { return res.send('Welcome home') } ) // example
    this.router.get('/roles', RoleController.index);
    this.router.post('/roles', RoleController.create);
    this.router.get('/roles/:id', RoleController.show);
    this.router.patch('/roles/:id', RoleController.update);
    this.router.delete('/roles/:id', RoleController.delete);


    this.router.get('/employees', EmployeeController.index);
    this.router.post('/employees', EmployeeController.create);
    this.router.get('/employees/:id', EmployeeController.show);
    this.router.patch('/employees/:id', EmployeeController.update);
    this.router.delete('/employees/:id', EmployeeController.delete);
    return this.router;
  }
}

const publicRoutes: PublicRoutes = new PublicRoutes();
export default publicRoutes.routes();
