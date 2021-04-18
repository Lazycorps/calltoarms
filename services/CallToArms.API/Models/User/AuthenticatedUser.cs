using CallToArms.Entities;
using CallToArms.Models.Game;
using CallToArms.Models.Notifications;
using System.Collections.Generic;

namespace CallToArms.Models
{
    public class AuthenticatedUser
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public List<GetGameDTO> Games { get; set; }
        public List<GetFriendshipDto> Friends { get; set; }
        public List<string> UserFirebaseTokens {get;set;}
        public List<GetNotification> NotificationsSent { get; set; }
        public List<GetNotification> NotificationsReceived { get; set; }
    }
}