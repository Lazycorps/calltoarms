using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Games.API.Models
{
    public class GameListItem
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public Guid Cover { get; set; }
        public Guid Thumbnail { get; set; }
    }
}
