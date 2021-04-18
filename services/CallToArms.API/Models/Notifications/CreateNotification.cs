using System;

namespace CallToArms.Models.Notifications
{
    public class CreateNotification
    {
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public int GameId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public int Validity { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string Resource { get; set; }
        public int ResourceId { get; set; }
    }
}