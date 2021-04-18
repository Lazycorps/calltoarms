using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CallToArms.Entities
{
    public class GameUser
    {
        public int GameId { get; set; }
        public EntityGame Game { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
    }
}
