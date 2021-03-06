using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Games.API.Models
{
    public class Game
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public Guid Cover { get; set; }
        public Guid Thumbnail { get; set; }
        public DateTime DateCreation { get; set; }
        public DateTime DateModification { get; set; }
    }
}
