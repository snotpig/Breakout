using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Mvc;
using Breakout.Models;

namespace Breakout.Controllers
{
    public class ScoresController : Controller
    {
        HiScores hiscores = new HiScores();

        public JsonResult get()
        {
            return Json(hiscores.getTopScores(6), JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult add(string name, string score)
        {
            int _score;
            if(int.TryParse(score, out _score) && !string.IsNullOrEmpty(name))
            {
                name = Regex.Replace(name, "[<>\"]+", "-");
                var hs = new HiScore()
                {
                    Name = name,
                    Score = _score,
                    IPaddr = Request.UserHostAddress,
                    Time = DateTime.Now
                };
                hiscores.addScore(hs);
            }
            return Json(hiscores.getTopScores(6));
        }

        public ActionResult dhs()
        {
            
            return RedirectToAction("Index", "Home");
        }
    }
}