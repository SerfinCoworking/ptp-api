import { Router } from 'express';
import RoleController from '../controllers/role.controller';
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
    return this.router;
  }
}

const publicRoutes: PublicRoutes = new PublicRoutes();
export default publicRoutes.routes();
