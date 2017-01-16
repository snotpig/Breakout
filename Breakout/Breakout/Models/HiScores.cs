using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Xml.Serialization;

namespace Breakout.Models
{
    public class HiScores
    {
        public static string fileName;
        public List<HiScore> scores { get; }

        public HiScores()
        {
            var context = HttpContext.Current;
            if (context != null)
            {
                fileName = context.Server.MapPath("~\\HiScores\\HiScores.xml");
            }
            XmlSerializer writer = new XmlSerializer(typeof(SaveObject));
            if (File.Exists(fileName))
            {
                using (var fs = new FileStream(fileName, FileMode.Open))
                {
                    var so = ((SaveObject)writer.Deserialize(fs));
                    scores = so.scores;
                }
            }
            else scores = new List<HiScore>();
        }

        public IEnumerable<object> getTopScores(int num)
        {
            return scores.OrderByDescending(s => s.Score).Take(num).Select(s => new { name = s.Name, score = s.Score }); 
        }

        public void addScore(HiScore score)
        {
            scores.Add(score);
            var saveObject = new SaveObject();
            saveObject.scores = scores;

            XmlSerializer writer = new XmlSerializer(typeof(SaveObject));
            using (FileStream fs = new FileStream(fileName, FileMode.OpenOrCreate))
            {
                writer.Serialize(fs, saveObject);
            }
        }

        [Serializable]
        public class SaveObject
        {
            public List<HiScore> scores;
        }
    }
}