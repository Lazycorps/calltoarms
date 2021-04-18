using System;
using System.Security.Claims;
using AutoMapper;
using CallToArms.Entities;
using CallToArms.Models.Notifications;
using Microsoft.AspNetCore.Http;

namespace CallToArms.Services
{
    public interface INotificationsService {
        void SendNotification(CreateNotification newNotification);
        void CreateNotification(CreateNotification newNotification);
    }

    public class NotificationsService : INotificationsService {

        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public NotificationsService(AppDbContext context, IMapper mapper, IHttpContextAccessor httpContextAccessor){
            _context = context;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }

        public void SendNotification(CreateNotification newNotification) {
            throw new NotImplementedException();
        }

        public void CreateNotification(CreateNotification newNotification) {
            Notification notification = _mapper.Map<Notification>(newNotification);
            notification.SenderId = GetUserId();
            _context.Notifications.Add(notification);
            _context.SaveChanges();
        }

        private int GetUserId() => int.Parse(_httpContextAccessor.HttpContext.User.FindFirstValue("id"));
    }
}