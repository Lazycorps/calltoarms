using System.ComponentModel.DataAnnotations;

namespace CallToArms.Models
{
  public class RegisterUser
  {
    [Required]
    public string Email { get; set; }
    [Required]
    public string Password { get; set; }
    [Required]
    public string Username { get; set; }
  }
}