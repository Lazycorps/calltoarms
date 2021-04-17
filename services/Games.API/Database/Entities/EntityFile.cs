using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Games.API.Database.Entities
{
    public class EntityFile
    {
        public Guid Id { get; set; }
        public string Extension { get; set; }
        public byte[] File { get; set; }
        public DateTime CreationDate { get; set; }
    }
}
