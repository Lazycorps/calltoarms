using Microsoft.EntityFrameworkCore;

namespace CallToArms.Entities
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
            Database.Migrate();
        }

        public DbSet<User> Users { get; set; }
        public DbSet<EntityGame> Games { get; set; }
        public DbSet<GameUser> GameUsers { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<UserFirebaseToken> UserFirebaseTokens { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<EntityFile> Files { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<EntityGame>()
                .HasIndex(g => g.Title).IsUnique();

            modelBuilder.Entity<GameUser>().HasKey(cs => new { cs.GameId, cs.UserId });

            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Sender)
                .WithMany(u => u.Friends)
                .HasForeignKey(f => f.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Friend)
                .WithMany(u => u.Followers)
                .HasForeignKey(f => f.FriendId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserFirebaseToken>().HasKey(c => new { c.UserId, c.FirebaseToken});    
            
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Sender)
                .WithMany(u => u.NotificationsSent)
                .HasForeignKey(n => n.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Receiver)
                .WithMany(u => u.NotificationsReceived)
                .HasForeignKey(n => n.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}