import Image from "next/image";
import Header from "./components/Header";
import Footer from "./components/Footer";

type RecentSpot = {
  name: string;
  image: string;
  gradient: string;
};

type Note = {
  id: string;
  text: string;
  avatar: string;
  alignment: "left" | "right";
};

type Post = {
  id: string;
  title: string;
  date: string;
  image: string;
  badge: {
    icon: string;
    label: string;
    variant: "rating" | "favorite";
  };
  notes?: Note[];
};

const recentSpots: RecentSpot[] = [
  {
    name: "Pizza 4P's",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAGeKX9wrracpdA8KSybq-3kGm4BOxaHlU3JEXFgBP89-MfWW7igouTd7oIjpUnRVhZ5lH-VcI_4Ip2ccT1rpO1j0SRaq5KfRzLQ3iSqNxsehBZfDpjs9vylyfLKFvr3b1Lf9ltoZpgKe0oMJx8m4XCOk0N7LnflYVP5jQQ8JsMFQPm7GS9nnvB1vHr9GKsWbVm2MbJIP9dI8xfycYV4ssIhBflC5ksaZlYzS76NUqFbklc2yXIG0VhpNl_Sd3s-bqkiYSLTc9ADiU",
    gradient: "from-primary to-accent",
  },
  {
    name: "Bánh Mì 25",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDjeUGLNa8K09IHOqrVXn1mCT8Vzz716naxUnnrxifua9hDvJZ87HsgBR6GsZa3B6wDM0ZCq0GYLcN7AAV3vfaB_Nusg4507x_TH-NdCZcq2lTuq-pqsBS9fcnJKKxHbZboDv93R4v8oEIPbSDgG5Yn2kvnktar3GEXANY62QAahi8iAOSD5P7Z3V7oqgf4f028YVPDrAHi5WN56AgJV5QaGr8f958QD3udh1c3NqX749lUujcbRWWy2ne3P6NN689LmcQVJyMtQWg",
    gradient: "from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600",
  },
  {
    name: "Cafe Giảng",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD208bWmojHKlES1WjVDgZP8Ch_EOQ_dhr1U0iLaPMB-PBEId__Em-j4bg7qG0f36Ht6_kPpevVzI2LBW63lub-kwfuJNaE6u_1e3oXsZkKsXgfAf4vm9kDtgxR3MtGhefjxlfKeNd_pg_vXoSANQJp2oAK1oBblTd4NLdEWL7_HmqAcA8H_Gt8Qum42viXhiyqJTfG9KMdtWYa4zG0mnHAwa0IWbSNfQRwMzkQMLmD-uzk75jSmBPzIOXx42CFS9riFKVR0FmY3Ss",
    gradient: "from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600",
  },
  {
    name: "Tim Ho Wan",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDKtfNcSnMHoUwbm4bcRK6bwCfTrU-lgqPwy3sc3uij8-y4eyiz4xhLg6ldREFPEAaPTf2ADw8cW7yAQtV0OJwptm2LMEdsm7iU9GR0Bg8rqhKGjps9mRrMihTRtxUf-yRbG_DUr3eb7kB3gCH_nS32kaJHgwQjiHKTmfFRNho3NWcrh8zDD3KVofDE6OZzQQJj-fGomhBzqVoQ-VFeg09F_Wl0XGz4uHWXuDi7GwJUsb2c2IuoUgNnLV9HjsEnT8x5GECBP4K6Os8",
    gradient: "from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600",
  },
];

const posts: Post[] = [
  {
    id: "bun-cha",
    title: "Bún Chả Hương Liên",
    date: "20 Tháng 10, 2023",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAKwNHiLN4I_YDIBmbDFQZVTK48MdymJ7E92aU_YT-tOnAoiNZtgBHqoCi3iloLmyVHTNb9DPD9eIj1tZEYgtI7VCw5VCoFAQW987ozG188DGEQLS28Vc_psdONpJ8BGuh5g-FcTWB4LLjgsX9vHlM_PEViJxRcdTAZXStxifqswVLJT-2WY0kF9r0KXkzqQ6seOvXGh6qDf0xTYbTsHJl1-ZEYQj2OwmV1iXeBeymoQzOBpiQEZbgdhr81B3vheyz6DanQUf_pCnY",
    badge: { icon: "star", label: "5.0", variant: "rating" },
    notes: [
      {
        id: "note-1",
        text: "Thịt nướng hôm nay tuyệt vời, đậm đà lắm!",
        avatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAfVU3c3uwI1BAYE33UxAoMwIC2a8vpbDVbdLrEdhVkJdHtA1yJZ4IbmeF4sn6Xw0-8QRMCQkQQ4Txzdbxi6pVRHGrsRpFJm4gkmUMddb1Q8qyZdCldvyJOmAlZoOaQgkpDb5jyGNN37Zx9BJDlms8jejZ5XuY4bmo_MSUQI0EdGHKSTCE9u2g3ysAXMAu20mf_kk5ff0n4laG8Ek0Z21gpv1s3JT5-1EWe46QtiwaEoonAwIPt3ps9mLowTwJ7kjV1IaFFFFYs7VY",
        alignment: "left",
      },
      {
        id: "note-2",
        text: "Em thích cái nước chấm, chua ngọt vừa miệng. ❤️",
        avatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC7w8jDYXQ1dmlNrQOlypNEfc1riXO-pQTZY6rO--MZeIUyTXrKQA_pTNV7qxUu2qJ5rb-6tieu05t6sipYiiuVk9ww2ZygVy89evKgL_alyW_A49b8FWvki3QnIs8XdeiyJOlLHu716dxZFiuAUf3mj0oHDKqXar3B0t0CQlwBab3fjUlMdLipcKhR001Jy__zjNC6KEtGSA8ReM5pzjQmjVA0Anaww0FvovN5XJzRw71iIpPh9AThxAiJhMti01JRqk8sE0wMyRk",
        alignment: "right",
      },
    ],
  },
  {
    id: "com-tam",
    title: "Cơm Tấm Cali",
    date: "15 Tháng 10, 2023",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDCDovVEnzRpJTcVUZGW-toZGRJdN3BDTyJJjIi1me2wXIprWxz-00pQygxgJdKwszcmc8cnRSQfSSBG-CgI_1SBjiD6yb8KHgik0f2_VjWl1i2HkoMstbTDwHbKBooxHMGSOCq08bWLGWYp5JY2qSTsUjh5IJ9VjPVm4HDxclaWDUW5RUutke3isa7e78eG_eqa6zaWo7EhUFBgH9FMuGL86Cy1l46ZiSRhXJ5qy3x4WiEn8Qx4oOkp38wKU9UEfCHBqxmbUUkisw",
    badge: { icon: "star", label: "4.2", variant: "rating" },
    notes: [
      {
        id: "note-3",
        text: "Sườn hơi khô một chút nhỉ?",
        avatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAsTnVQ5Y_ROVfd2ZtZN6fD49g6A0gcJh-RtGwy-Y7v_l45O7S4gNO1r3BzRidPuXv2IwS3Jis_JAO2ASvMoekKDyDTabUZd8qV6C5MK-rr-Kz_YNpf-F-ST6zwPyUlNWn1hYyw_TZjvsQHc9lchZFrVUG5SmIMXOaVJR2sazLR7r-H9MSqfYsuovYOEPi1zGURJ2xIiqxA77BeVj-3amo1IiTKkGggmjGR8EieH5C_1kRiWvc9f3L9LL_q37PlIvyk-ubykbtGq8k",
        alignment: "left",
      },
    ],
  },
  {
    id: "pho",
    title: "Phở 10 Lý Quốc Sư",
    date: "10 Tháng 10, 2023",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAjdCVoQ7g-lbAm1-OiRW0E5sTQVXg7nLU7fd-OfyXc9d2PGYfSNST6RdQbBX1IVLIosWepR923vgVk70p2I8MSthBcdNZhPvqoaBuYdljcSGxXOkJC4nkldb4PcG_VLRYE0mngRazD5GyA1kZHAH1rccFKB4ZNLX_CBApxvsqkiysLcvnZkjakQQegfcW2UKJMflokcm1I_r4J7w2LfEPaHkix6tfgf7MviocsBTEH6_BFdU288HFBKv4py8j_me-PXIPy6UpMUzA",
    badge: { icon: "favorite", label: "Yêu thích", variant: "favorite" },
  },
];

export default function Home() {
  return (
    <div suppressHydrationWarning className="bg-background-light dark:bg-[#0b0b0d] text-slate-800 dark:text-slate-100 h-screen w-full relative overflow-y-scroll snap-y snap-mandatory scroll-smooth scroll-pt-24 pt-20 pb-52">
      <Header />

      {/* <section className="mt-3 pl-6 pt-16 snap-start shrink-0">
        <div className="flex items-center justify-between pr-6 mb-3">
          <h2 className="text-lg font-bold text-primary-dark dark:text-white">Gần đây</h2>
          <button
            type="button"
            className="text-primary dark:text-white text-sm font-semibold hover:opacity-80"
          >
            Xem hết
          </button>
        </div>
        <div className="flex overflow-x-auto space-x-4 pb-4 pr-6 no-scrollbar snap-x">
          {recentSpots.map((spot) => (
            <div
              key={spot.name}
              className="flex flex-col items-center space-y-2 snap-start"
            >
              <div
                className={`w-20 h-20 p-[2px] rounded-full bg-gradient-to-tr ${spot.gradient}`}
              >
                <div className="w-full h-full rounded-full border-2 border-white dark:border-background-dark overflow-hidden">
                  <Image
                    src={spot.image}
                    alt={spot.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs font-medium truncate w-20 text-center text-slate-600 dark:text-slate-400">
                {spot.name}
              </span>
            </div>
          ))}
        </div>
      </section> */}

      <main className="px-4 pb-24 space-y-32 contents">
        {posts.map((post, index) => (
          <article
            key={post.id}
            className="ambient-container bg-white dark:bg-[#111317] rounded-xl shadow-blue-sm border border-card-border dark:border-[#1b1b1f] overflow-hidden snap-start shrink-0 w-[93%] mx-auto h-[65vh] flex flex-col relative"
          >
            {/* Ambient glow background layer */}
            <div
              className="ambient-glow"
              style={{
                backgroundImage: `url(${post.image})`,
              }}
              aria-hidden="true"
            />

            {/* Main Image Section - takes available space */}
            <div className="relative flex-1 w-full bg-slate-100 dark:bg-[#0f1012] overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute top-4 right-4 z-10 bg-white/95 dark:bg-[#0f1012]/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-md border border-slate-100 dark:border-[#1b1b1f]">
                <span className="material-icons-round text-sm text-primary dark:text-white">
                  {post.badge.icon}
                </span>
                <span className="text-xs font-bold text-primary-dark dark:text-white">
                  {post.badge.label}
                </span>
              </div>
            </div>

            {/* Content Section - content at bottom */}
            <div className="p-5 shrink-0 bg-white dark:bg-[#111317] relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-primary-dark dark:text-white leading-tight mb-1">
                    {post.title}
                  </h3>
                  <div className="flex items-center text-slate-400 text-xs">
                    <span className="material-icons-round text-sm mr-1">calendar_today</span>
                    {post.date}
                  </div>
                </div>
                <button
                  type="button"
                  className={
                    post.badge.variant === "favorite"
                      ? "text-primary dark:text-white hover:text-primary dark:hover:text-white"
                      : "text-slate-300 hover:text-primary dark:hover:text-white"
                  }
                >
                  <span className="material-icons-round">
                    {post.badge.variant === "favorite" ? "bookmark" : "bookmark_border"}
                  </span>
                </button>
              </div>

              {post.notes ? (
                <div className="space-y-3 bg-primary-light/30 dark:bg-[#161820] p-4 rounded-xl border border-primary-light/50 dark:border-transparent">
                  {post.notes.map((note) => {
                    const isRight = note.alignment === "right";

                    return (
                      <div
                        key={note.id}
                        className={`flex gap-3 ${isRight ? "flex-row-reverse" : ""}`}
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-1 ring-1 ring-white">
                          <Image
                            src={note.avatar}
                            alt="avatar"
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div
                          className={`rounded-2xl p-3 flex-1 text-sm ${isRight
                            ? "bg-primary-light dark:bg-[#1f2127] rounded-tr-none text-right text-primary-dark dark:text-white"
                            : "bg-white dark:bg-[#181a1f] rounded-tl-none text-slate-600 dark:text-slate-200 shadow-sm"
                            }`}
                        >
                          {note.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 bg-primary-light/30 dark:bg-[#161820] p-4 rounded-xl border border-primary-light/50 dark:border-transparent">
                  <div className="text-center text-xs text-slate-400 italic">
                    Chưa có ghi chú nào. Chạm để thêm!
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </main>

      <Footer />
    </div>
  );
}
