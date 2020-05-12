

 export class FriendDTO {
   public id: number = 0;
   public email: string = '';
   public username: string = '';
 }
 
 export class Friend extends FriendDTO {
   constructor(data?: FriendDTO) {
     super();
     Object.assign(this, data || new FriendDTO());
   }
 }