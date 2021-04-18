using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace CallToArms.Entities
{
    public class EntityGame
    {   
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }
        public Guid Cover { get; set; }
        public Guid Thumbnail { get; set; }
        public DateTime DateCreation { get; set; }
        public DateTime DateModification { get; set; }

        public List<GameUser> GameUsers { get; set; }
    }
}
