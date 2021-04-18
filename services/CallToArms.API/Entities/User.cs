using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CallToArms.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public bool IsAdmin { get; set; }

        [JsonIgnore]
        public string Password { get; set; }

        public List<GameUser> GameUsers { get; set; }
        
        public List<UserFirebaseToken> UserFirebaseTokens { get; set; }

        public virtual ICollection<Notification> NotificationsReceived { get; set; }
        public virtual ICollection<Notification> NotificationsSent { get; set; }

        public virtual ICollection<Friendship> Friends { get; set; }
        public virtual ICollection<Friendship> Followers { get; set; }
    }
}