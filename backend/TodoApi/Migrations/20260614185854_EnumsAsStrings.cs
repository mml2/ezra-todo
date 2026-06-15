using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    /// <inheritdoc />
    public partial class EnumsAsStrings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Convert Status enum values from integers to strings BEFORE changing column type
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Todo' WHERE Status = '0'");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'InProgress' WHERE Status = '1'");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Done' WHERE Status = '2'");

            // Convert Priority enum values from integers to strings BEFORE changing column type
            migrationBuilder.Sql("UPDATE Tasks SET Priority = 'Low' WHERE Priority = '0'");
            migrationBuilder.Sql("UPDATE Tasks SET Priority = 'Medium' WHERE Priority = '1'");
            migrationBuilder.Sql("UPDATE Tasks SET Priority = 'High' WHERE Priority = '2'");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Tasks",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AlterColumn<string>(
                name: "Priority",
                table: "Tasks",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Convert Status enum values from strings back to integers BEFORE changing column type
            migrationBuilder.Sql("UPDATE Tasks SET Status = '0' WHERE Status = 'Todo'");
            migrationBuilder.Sql("UPDATE Tasks SET Status = '1' WHERE Status = 'InProgress'");
            migrationBuilder.Sql("UPDATE Tasks SET Status = '2' WHERE Status = 'Done'");

            // Convert Priority enum values from strings back to integers BEFORE changing column type
            migrationBuilder.Sql("UPDATE Tasks SET Priority = '0' WHERE Priority = 'Low'");
            migrationBuilder.Sql("UPDATE Tasks SET Priority = '1' WHERE Priority = 'Medium'");
            migrationBuilder.Sql("UPDATE Tasks SET Priority = '2' WHERE Priority = 'High'");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Tasks",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<int>(
                name: "Priority",
                table: "Tasks",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT");
        }
    }
}
