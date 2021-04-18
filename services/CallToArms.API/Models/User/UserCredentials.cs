using System.ComponentModel.DataAnnotations;

namespace CallToArms.Models
{
  public class UserCredentials
  {
    [Required]
    public string Login { get; set; }
    [Required]
    public string Password { get; set; }

  }
}