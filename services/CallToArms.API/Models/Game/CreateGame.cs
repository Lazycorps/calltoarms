using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace CallToArms.Models
{
    public class CreateGame
    {   
        [Required]
        public string Title { get; set; }
    }
}
