using System.Web.Optimization;

namespace Breakout
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new StyleBundle("~/content/css").Include(
                        "~/Content/game.css"
                ));

            bundles.Add(new ScriptBundle("~/bundles/js").Include(
                        "~/Scripts/ga.js",
                        "~/Scripts/ld.js",
                        "~/Scripts/bo.js"));
        }
    }
}