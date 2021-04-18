using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CallToArms.Entities
{
    public class UserFirebaseToken
    {
        public int UserId { get; set; }
        public string FirebaseToken { get; set; }
    }
}
