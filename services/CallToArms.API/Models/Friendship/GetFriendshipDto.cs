using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CallToArms.Models
{
    public class GetFriendshipDto
    {
        public int Id { get; set; }
        public string Status { get; set; }
        public int FriendId { get; set; }
        public string FriendUsername { get; set; }
    }
}
