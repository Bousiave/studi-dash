import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Clock,
  CheckCircle2,
  Archive,
  TrendingUp
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string;
  color: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  totalCourses: number;
  activeCourses: number;
  completedCourses: number;
  totalNotes: number;
}

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    activeCourses: 0,
    completedCourses: 0,
    totalNotes: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(6);

      if (coursesError) throw coursesError;

      // Fetch notes count
      const { count: notesCount, error: notesError } = await supabase
        .from('course_notes')
        .select('*', { count: 'exact', head: true });

      if (notesError) throw notesError;

      setCourses(coursesData || []);
      
      const totalCourses = coursesData?.length || 0;
      const activeCourses = coursesData?.filter(c => c.status === 'active').length || 0;
      const completedCourses = coursesData?.filter(c => c.status === 'completed').length || 0;

      setStats({
        totalCourses,
        activeCourses,
        completedCourses,
        totalNotes: notesCount || 0
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'archived':
        return <Archive className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'archived':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue ! Voici un aperçu de vos cours.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/courses/new')}
          className="bg-gradient-primary hover:opacity-90 shadow-glow"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau cours
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card border-0 bg-gradient-primary text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">
                  Total des cours
                </p>
                <p className="text-3xl font-bold">{stats.totalCourses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Cours actifs
                </p>
                <p className="text-3xl font-bold text-primary">{stats.activeCourses}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Cours terminés
                </p>
                <p className="text-3xl font-bold text-success">{stats.completedCourses}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Total des notes
                </p>
                <p className="text-3xl font-bold text-accent">{stats.totalNotes}</p>
              </div>
              <FileText className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Courses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Cours récents</h2>
          <Button 
            variant="outline" 
            onClick={() => navigate('/courses')}
          >
            Voir tout
          </Button>
        </div>

        {courses.length === 0 ? (
          <Card className="shadow-card border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun cours pour le moment</h3>
              <p className="text-muted-foreground text-center mb-6">
                Créez votre premier cours pour commencer à organiser vos études
              </p>
              <Button 
                onClick={() => navigate('/courses/new')}
                className="bg-gradient-primary hover:opacity-90 shadow-glow"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un cours
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card 
                key={course.id} 
                className="shadow-card border-0 hover:shadow-glow transition-all cursor-pointer"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: course.color }}
                    />
                    <Badge className={getStatusIcon(course.status) ? getStatusColor(course.status) : ''}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(course.status)}
                        {course.status}
                      </div>
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {course.description || "Aucune description"}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Mis à jour {new Date(course.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}