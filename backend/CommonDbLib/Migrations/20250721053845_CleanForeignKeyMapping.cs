using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CommonDbLib.Migrations
{
    /// <inheritdoc />
    public partial class CleanForeignKeyMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DataSheetLv3s_EstimateSheetLv1s_EstimateSheetCurEstimateNo",
                table: "DataSheetLv3s");

            migrationBuilder.DropForeignKey(
                name: "FK_DataSheetLv3s_ItemLists_ItemCode1",
                table: "DataSheetLv3s");

            migrationBuilder.DropIndex(
                name: "IX_DataSheetLv3s_EstimateSheetCurEstimateNo",
                table: "DataSheetLv3s");

            migrationBuilder.DropIndex(
                name: "IX_DataSheetLv3s_ItemCode1",
                table: "DataSheetLv3s");

            migrationBuilder.DropColumn(
                name: "EstimateSheetCurEstimateNo",
                table: "DataSheetLv3s");

            migrationBuilder.DropColumn(
                name: "ItemCode1",
                table: "DataSheetLv3s");

            migrationBuilder.CreateIndex(
                name: "IX_DataSheetLv3s_EstimateNo",
                table: "DataSheetLv3s",
                column: "EstimateNo");

            migrationBuilder.CreateIndex(
                name: "IX_DataSheetLv3s_ItemCode",
                table: "DataSheetLv3s",
                column: "ItemCode");

            migrationBuilder.AddForeignKey(
                name: "FK_DataSheetLv3s_EstimateSheetLv1s_EstimateNo",
                table: "DataSheetLv3s",
                column: "EstimateNo",
                principalTable: "EstimateSheetLv1s",
                principalColumn: "CurEstimateNo",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DataSheetLv3s_ItemLists_ItemCode",
                table: "DataSheetLv3s",
                column: "ItemCode",
                principalTable: "ItemLists",
                principalColumn: "ItemCode",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DataSheetLv3s_EstimateSheetLv1s_EstimateNo",
                table: "DataSheetLv3s");

            migrationBuilder.DropForeignKey(
                name: "FK_DataSheetLv3s_ItemLists_ItemCode",
                table: "DataSheetLv3s");

            migrationBuilder.DropIndex(
                name: "IX_DataSheetLv3s_EstimateNo",
                table: "DataSheetLv3s");

            migrationBuilder.DropIndex(
                name: "IX_DataSheetLv3s_ItemCode",
                table: "DataSheetLv3s");

            migrationBuilder.AddColumn<string>(
                name: "EstimateSheetCurEstimateNo",
                table: "DataSheetLv3s",
                type: "varchar(50)",
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ItemCode1",
                table: "DataSheetLv3s",
                type: "varchar(50)",
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DataSheetLv3s_EstimateSheetCurEstimateNo",
                table: "DataSheetLv3s",
                column: "EstimateSheetCurEstimateNo");

            migrationBuilder.CreateIndex(
                name: "IX_DataSheetLv3s_ItemCode1",
                table: "DataSheetLv3s",
                column: "ItemCode1");

            migrationBuilder.AddForeignKey(
                name: "FK_DataSheetLv3s_EstimateSheetLv1s_EstimateSheetCurEstimateNo",
                table: "DataSheetLv3s",
                column: "EstimateSheetCurEstimateNo",
                principalTable: "EstimateSheetLv1s",
                principalColumn: "CurEstimateNo",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DataSheetLv3s_ItemLists_ItemCode1",
                table: "DataSheetLv3s",
                column: "ItemCode1",
                principalTable: "ItemLists",
                principalColumn: "ItemCode",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
