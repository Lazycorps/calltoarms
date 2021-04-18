using CallToArms.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CallToArms.Models.Notifications
{
    public class GetNotification
    {
        public string SenderUsername { get; set; }
        public string ReceiverUsername { get; set; }
        public int GameId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Response { get; set; }
        public string NotificationType { get; set; }
        public int Validity { get; set; }
        public DateTime CreatedAt { get; set; }

        public bool expired
        {
            get
            {
                return this.CreatedAt < DateTime.Now.Subtract(new TimeSpan(0, this.Validity, 0));
            }
        }
    }
}
