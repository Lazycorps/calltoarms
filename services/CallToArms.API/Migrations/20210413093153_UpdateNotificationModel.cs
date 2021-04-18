using Microsoft.EntityFrameworkCore.Migrations;

namespace CallToArms.Migrations
{
    public partial class UpdateNotificationModel : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotificationType",
                table: "Notifications");

            migrationBuilder.RenameColumn(
                name: "Validity",
                table: "Notifications",
                newName: "ResourceId");

            migrationBuilder.RenameColumn(
                name: "Response",
                table: "Notifications",
                newName: "Resource");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ResourceId",
                table: "Notifications",
                newName: "Validity");

            migrationBuilder.RenameColumn(
                name: "Resource",
                table: "Notifications",
                newName: "Response");

            migrationBuilder.AddColumn<string>(
                name: "NotificationType",
                table: "Notifications",
                type: "text",
                nullable: true);
        }
    }
}
