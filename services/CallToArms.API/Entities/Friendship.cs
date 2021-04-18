using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace CallToArms.Entities
{
    public class Friendship
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public int FriendId { get; set; }
        
        public User Sender { get; set; }

        public User Friend { get; set; }

        public string Status { get; set; } = "pending";
    }
}
