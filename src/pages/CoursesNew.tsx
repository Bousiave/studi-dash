import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Palette } from "lucide-react";

const courseColors = [
  '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e', 
  '#e17055', '#00b894', '#00cec9', '#0984e3',
  '#6c5ce7', '#fd79a8', '#e84393', '#00b894'
];

export default function CoursesNew() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(courseColors[0]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le titre est obligatoire",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error("Utilisateur non connecté");
      }

      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          color: selectedColor,
          user_id: session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Cours créé !",
        description: "Votre nouveau cours a été créé avec succès",
      });

      navigate(`/courses/${data.id}`);
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le cours",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Nouveau cours
          </h1>
          <p className="text-muted-foreground">
            Créez un nouveau cours pour organiser vos études
          </p>
        </div>
      </div>

      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle>Informations du cours</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createCourse} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du cours *</Label>
              <Input
                id="title"
                placeholder="Ex: Mathématiques avancées"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez brièvement le contenu de ce cours..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Couleur du cours
              </Label>
              <div className="grid grid-cols-6 gap-3">
                {courseColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`
                      w-10 h-10 rounded-lg border-2 transition-all hover:scale-110
                      ${selectedColor === color 
                        ? 'border-foreground shadow-glow' 
                        : 'border-transparent hover:border-muted-foreground'
                      }
                    `}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-primary hover:opacity-90 shadow-glow"
              >
                {loading ? "Création..." : "Créer le cours"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}