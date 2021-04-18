using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CallToArms.Models.Game
{
    public class GetGameDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public Guid Cover { get; set; }
        public Guid Thumbnail { get; set; }
    }
}
