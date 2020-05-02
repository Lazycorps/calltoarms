

 export class FriendDTO {
   public id: string = '';
   public email: string = '';
   public username: string = '';
 }
 
 export class Friend extends FriendDTO {
   constructor(data?: FriendDTO) {
     super();
     Object.assign(this, data || new FriendDTO());
   }
 }