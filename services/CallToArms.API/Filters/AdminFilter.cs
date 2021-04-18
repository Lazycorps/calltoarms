using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CallToArms.Filters
{
    public class AdminFilter : IActionFilter 
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            // Retrieve isAdmin claim in token
            var isAdmin = context.HttpContext.User.Claims.ElementAt(2).Value;

            if (isAdmin != "True")
            {
                context.Result = new UnauthorizedObjectResult("You need to be an admin !");
                return;
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // our code after action executes
        }
    }
}
