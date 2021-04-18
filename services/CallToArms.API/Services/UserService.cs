using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using CallToArms.Models;
using CallToArms.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace CallToArms.Services
{
    public interface IUserService
    {
        (AuthenticatedUser authenticatedUser, string token) Authenticate(UserCredentials model);
        AuthenticatedUser GetUser(int id);
        IEnumerable<GetUser> GetAllUsers();
        IEnumerable<GetUser> AutocompleteUsers(string query, int limit);
    }

    public class UserService : IUserService
    {
        public IConfiguration Configuration { get; }
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public UserService(IConfiguration configuration, AppDbContext context, IMapper mapper)
        {
            Configuration = configuration;
            _context = context;
            _mapper = mapper;
        }

        public IEnumerable<GetUser> GetAllUsers(){
            var users = _context.Users;

            return users.Select(u => _mapper.Map<GetUser>(u));
        }

        public IEnumerable<GetUser> AutocompleteUsers(string query, int limit){
            var users = _context.Users.Where(u => u.Username.ToLower().StartsWith(query)).Take(limit);

            return users.Select(u => _mapper.Map<GetUser>(u));
        }

        public AuthenticatedUser GetUser(int id) {
            User user = _context.Users
                .Include(u => u.GameUsers).ThenInclude(gu => gu.Game)
                .Include(u => u.Friends).ThenInclude(f => f.Friend)
                .Include(u => u.UserFirebaseTokens)
                .Include(u => u.NotificationsSent)
                .Include(u => u.NotificationsReceived).FirstOrDefault(u => u.Id == id);

            return _mapper.Map<AuthenticatedUser>(user);
        }

        public (AuthenticatedUser authenticatedUser, string token) Authenticate(UserCredentials model)
        {
            var user = _context.Users
                .Include(u => u.GameUsers).ThenInclude(gu => gu.Game)
                .Include(u => u.Friends).ThenInclude(f => f.Friend)
                .Include(u => u.UserFirebaseTokens)
                .Include(u => u.NotificationsSent)
                .Include(u => u.NotificationsReceived)
                .FirstOrDefault(u => u.Email == model.Login || u.Username == model.Login);

            if (user == null || !PasswordMatches(user, user.Password, model.Password))
            {
                return (null, null);
            }

            AuthenticatedUser authenticatedUser = _mapper.Map<AuthenticatedUser>(user);

            return (authenticatedUser, generateJwtToken(user));
        }

        private bool PasswordMatches(User user, string hashedPassword, string password)
        {
            var passwordHasher = new PasswordHasher<User>();
            bool verified = false;
            var result = passwordHasher.VerifyHashedPassword(user, hashedPassword, password);
            if (result == PasswordVerificationResult.Success) verified = true;
            else if (result == PasswordVerificationResult.SuccessRehashNeeded) verified = true;
            else if (result == PasswordVerificationResult.Failed) verified = false;

            return verified;
        }

        private string generateJwtToken(User user)
        {
            // generate token that is valid for 7 days
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(Configuration["JWT:Secret"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim("id", user.Id.ToString()),
                    new Claim("username", user.Username),
                    new Claim("isAdmin", user.IsAdmin.ToString()),
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}