using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CallToArms.Entities
{
    public class Notification
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public User Sender { get; set; }
        public int ReceiverId { get; set; }
        public User Receiver { get; set; }
        public int GameId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Resource { get; set; }
        public int ResourceId { get; set; }
    }
}
