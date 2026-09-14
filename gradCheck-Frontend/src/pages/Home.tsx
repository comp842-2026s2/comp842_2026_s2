import { Link, useNavigate } from "react-router";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body text-center p-5">
              <h1 className="h3 mb-4">
                Student Management
              </h1>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate("/student/register")}
              >
                Register Student
              </button>
             <br />

              <div className="mt-3">
                <Link to="/staff">
                  Go to Staff Page
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;