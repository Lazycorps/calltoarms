
 export class UserRegisterDTO {
   public username: string = '';
   public email: string = '';
   public password: string = '';
   public password_confirmation: string = '';
 }
 
 export class UserRegister extends UserRegisterDTO{
   constructor(data?: UserRegisterDTO){
     super();
     Object.assign(this, data || new UserRegisterDTO());
   }
 }